import React, { useEffect, useState } from 'react';
import axios from 'axios';

/**
 * props:
 *  - mode: 'individual' | 'group'
 *  - onSubmit: (formData) => void
 *  - initialValues?: { amount, paymentDate, memberId(s) }
 *  - disabled?: boolean
 */
function ContributionForm({ mode = 'individual', onSubmit, disabled = false, initialValues = {} }) {
  const [members, setMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState(initialValues.memberIds || []);
  const [selectedMember, setSelectedMember] = useState(initialValues.memberId || '');
  const [amount, setAmount] = useState(initialValues.amount || '');
  const [paymentDate, setPaymentDate] = useState(initialValues.paymentDate || new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8080/mut/member', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMembers(res.data);
    } catch (err) {
      setError("Erreur lors du chargement des membres");
    } finally {
      setLoading(false);
    }
  };

  const handleMemberSelect = (id) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((mid) => mid !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!amount || (mode === 'group' ? selectedMembers.length === 0 : !selectedMember)) {
      setError('Veuillez sélectionner le(s) membre(s) et saisir le montant.');
      return;
    }
    if (mode === 'group') {
      onSubmit({
        memberIds: selectedMembers,
        individualAmount: parseFloat(amount),
        totalAmount: selectedMembers.length * parseFloat(amount),
        paymentDate: paymentDate + 'T00:00:00',
      });
    } else {
      onSubmit({
        memberId: selectedMember,
        amount: parseFloat(amount),
        paymentDate: paymentDate + 'T00:00:00',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label className="form-label fw-semibold">Montant (FCFA)</label>
        <input
          type="number"
          className="form-control"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          min="1"
          required
          disabled={disabled}
        />
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold">Date de paiement</label>
        <input
          type="date"
          className="form-control"
          value={paymentDate}
          onChange={e => setPaymentDate(e.target.value)}
          required
          disabled={disabled}
        />
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold">{mode === 'group' ? 'Sélectionner les membres' : 'Sélectionner le membre'}</label>
        {loading ? (
          <div>Chargement...</div>
        ) : mode === 'group' ? (
          <div className="row">
            {members.map(member => (
              <div className="col-md-4 mb-2" key={member.id}>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={`member-${member.id}`}
                    checked={selectedMembers.includes(member.id)}
                    onChange={() => handleMemberSelect(member.id)}
                    disabled={disabled}
                  />
                  <label className="form-check-label" htmlFor={`member-${member.id}`}>
                    {member.name} {member.firstName} ({member.email})
                  </label>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <select
            className="form-select"
            value={selectedMember}
            onChange={e => setSelectedMember(e.target.value)}
            required
            disabled={disabled}
          >
            <option value="">Choisir un membre</option>
            {members.map(member => (
              <option key={member.id} value={member.id}>
                {member.name} {member.firstName} ({member.email})
              </option>
            ))}
          </select>
        )}
      </div>
      {mode === 'group' && (
        <div className="mb-3">
          <label className="form-label fw-semibold">Montant total</label>
          <input
            type="text"
            className="form-control"
            value={selectedMembers.length && amount ? selectedMembers.length * parseFloat(amount) : ''}
            readOnly
          />
        </div>
      )}
      {error && <div className="alert alert-danger">{error}</div>}
      <button type="submit" className="btn btn-primary" disabled={disabled}>
        Valider la cotisation {mode === 'group' ? 'groupée' : 'individuelle'}
      </button>
    </form>
  );
}

export default ContributionForm;
